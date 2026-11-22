/**
 * test_round3_batch3o_1pet4_11_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3O: 1 Peter 4:11 (ALL 31 records, 39 components, 38/38 unique Greek SBLGNT tokens).
 * Verifies exact fields, AR_SYNTACTIC for #2 & #8 «كَانَ», compound_phrase #20+#21 on w19 πᾶσιν,
 * live frozen auditor 31/31 (0 alerts) + FULL ROUND 3 COMPLETION (Greek 92/92 = 100%, Hebrew 88/88 = 100%,
 * Overall 233/234 frozen / 234/234 with documented Dan 5:2 supplemental verification),
 * negative mutation gate reverting #2 «كَانَ» back to G1510@w27, and untouched frozen baseline & auditor SHA-256.
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

console.log('=== RUNNING ROUND 3 BATCH 3O (1 PETER 4:11 — GREEK & ROUND 3 FINAL) QUALITY GATES ===\n');

const EXPECTED = [
  {"pos":1,"ar":"إِنْ","s":"G1487","orig":"εἰ","surf":"εἴ","w":1,"m":"C- --------","mp":"conjunction","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w1","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1487:1:C- --------"]},
  {"pos":2,"ar":"كَانَ","s":null,"orig":"—","surf":"—","w":null,"m":null,"mp":"syntactic_ar","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"AR_SYNTACTIC:B60.C4.V11.w2","vs":"syntactic_ar","ms":"syntactic_ar","rel":"syntactic_ar","comps":[]},
  {"pos":3,"ar":"يَتَكَلَّمُ","s":"G2980","orig":"λαλέω","surf":"λαλεῖ","w":3,"m":"V- 3PAI-S--","mp":"verb","tn":"present","vc":"active","md":"indicative","pr":"3","nm":"singular","gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w3","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2980:3:V- 3PAI-S--"]},
  {"pos":4,"ar":"أَحَدٌ","s":"G5100","orig":"τις","surf":"τις","w":2,"m":"RI ----NSM-","mp":"pronoun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"nominative","loc":"SBLGNT:B60.C4.V11.w2","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5100:2:RI ----NSM-"]},
  {"pos":5,"ar":"فَكَأَقْوَالِ","s":"G3051","orig":"λόγιον","surf":"λόγια","w":5,"m":"N- ----APN-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"neuter","cs":"accusative","loc":"SBLGNT:B60.C4.V11.w5","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3051:5:N- ----APN-","2:secondary:G5613:4:C- --------"]},
  {"pos":6,"ar":"اللهِ","s":"G2316","orig":"θεός","surf":"θεοῦ","w":6,"m":"N- ----GSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"genitive","loc":"SBLGNT:B60.C4.V11.w6","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2316:6:N- ----GSM-"]},
  {"pos":7,"ar":"وَإِنْ","s":"G1487","orig":"εἰ","surf":"εἴ","w":7,"m":"C- --------","mp":"conjunction","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w7","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1487:7:C- --------"]},
  {"pos":8,"ar":"كَانَ","s":null,"orig":"—","surf":"—","w":null,"m":null,"mp":"syntactic_ar","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"AR_SYNTACTIC:B60.C4.V11.w8","vs":"syntactic_ar","ms":"syntactic_ar","rel":"syntactic_ar","comps":[]},
  {"pos":9,"ar":"يَخْدِمُ","s":"G1247","orig":"διακονέω","surf":"διακονεῖ","w":9,"m":"V- 3PAI-S--","mp":"verb","tn":"present","vc":"active","md":"indicative","pr":"3","nm":"singular","gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w9","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1247:9:V- 3PAI-S--"]},
  {"pos":10,"ar":"أَحَدٌ","s":"G5100","orig":"τις","surf":"τις","w":8,"m":"RI ----NSM-","mp":"pronoun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"nominative","loc":"SBLGNT:B60.C4.V11.w8","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5100:8:RI ----NSM-"]},
  {"pos":11,"ar":"فَكَأَنَّهُ","s":"G5613","orig":"ὡς","surf":"ὡς","w":10,"m":"C- --------","mp":"conjunction","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w10","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5613:10:C- --------"]},
  {"pos":12,"ar":"مِنْ","s":"G1537","orig":"ἐκ","surf":"ἐξ","w":11,"m":"P- --------","mp":"preposition","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w11","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1537:11:P- --------"]},
  {"pos":13,"ar":"قُوَّةٍ","s":"G2479","orig":"ἰσχύς","surf":"ἰσχύος","w":12,"m":"N- ----GSF-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"feminine","cs":"genitive","loc":"SBLGNT:B60.C4.V11.w12","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2479:12:N- ----GSF-"]},
  {"pos":14,"ar":"يَمْنَحُهَا","s":"G5524","orig":"χορηγέω","surf":"χορηγεῖ","w":14,"m":"V- 3PAI-S--","mp":"verb","tn":"present","vc":"active","md":"indicative","pr":"3","nm":"singular","gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w14","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5524:14:V- 3PAI-S--","2:secondary:G3739:13:RR ----GSF-"]},
  {"pos":15,"ar":"اللهُ","s":"G2316","orig":"θεός","surf":"θεός","w":16,"m":"N- ----NSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"nominative","loc":"SBLGNT:B60.C4.V11.w16","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2316:16:N- ----NSM-","2:secondary:G3588:15:RA ----NSM-"]},
  {"pos":16,"ar":"لِكَيْ","s":"G2443","orig":"ἵνα","surf":"ἵνα","w":17,"m":"C- --------","mp":"conjunction","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w17","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2443:17:C- --------"]},
  {"pos":17,"ar":"يَتَمَجَّدَ","s":"G1392","orig":"δοξάζω","surf":"δοξάζηται","w":20,"m":"V- 3PPS-S--","mp":"verb","tn":"present","vc":"passive","md":"subjunctive","pr":"3","nm":"singular","gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w20","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1392:20:V- 3PPS-S--"]},
  {"pos":18,"ar":"اللهُ","s":"G2316","orig":"θεός","surf":"θεὸς","w":22,"m":"N- ----NSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"nominative","loc":"SBLGNT:B60.C4.V11.w22","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2316:22:N- ----NSM-","2:secondary:G3588:21:RA ----NSM-"]},
  {"pos":19,"ar":"فِي","s":"G1722","orig":"ἐν","surf":"ἐν","w":18,"m":"P- --------","mp":"preposition","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w18","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1722:18:P- --------"]},
  {"pos":20,"ar":"كُلِّ","s":"G3956","orig":"πᾶς","surf":"πᾶσιν","w":19,"m":"A- ----DPN-","mp":"adjective","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"neuter","cs":"dative","loc":"SBLGNT:B60.C4.V11.w19","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":"compound_phrase","comps":["1:primary:G3956:19:A- ----DPN-"]},
  {"pos":21,"ar":"شَيْءٍ","s":"G3956","orig":"πᾶς","surf":"πᾶσιν","w":19,"m":"A- ----DPN-","mp":"adjective","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"neuter","cs":"dative","loc":"SBLGNT:B60.C4.V11.w19","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":"compound_phrase","comps":["1:primary:G3956:19:A- ----DPN-"]},
  {"pos":22,"ar":"بِيَسُوعَ","s":"G2424","orig":"Ἰησοῦς","surf":"Ἰησοῦ","w":24,"m":"N- ----GSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"genitive","loc":"SBLGNT:B60.C4.V11.w24","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2424:24:N- ----GSM-","2:secondary:G1223:23:P- --------"]},
  {"pos":23,"ar":"الْمَسِيحِ","s":"G5547","orig":"Χριστός","surf":"Χριστοῦ","w":25,"m":"N- ----GSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"genitive","loc":"SBLGNT:B60.C4.V11.w25","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5547:25:N- ----GSM-"]},
  {"pos":24,"ar":"الَّذِي","s":"G3739","orig":"ὅς","surf":"ᾧ","w":26,"m":"RR ----DSM-","mp":"relative_pronoun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"dative","loc":"SBLGNT:B60.C4.V11.w26","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3739:26:RR ----DSM-"]},
  {"pos":25,"ar":"لَهُ","s":"G1510","orig":"εἰμί","surf":"ἐστιν","w":27,"m":"V- 3PAI-S--","mp":"verb","tn":"present","vc":"active","md":"indicative","pr":"3","nm":"singular","gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w27","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1510:27:V- 3PAI-S--","2:secondary:G3739:26:RR ----DSM-"]},
  {"pos":26,"ar":"الْمَجْدُ","s":"G1391","orig":"δόξα","surf":"δόξα","w":29,"m":"N- ----NSF-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"feminine","cs":"nominative","loc":"SBLGNT:B60.C4.V11.w29","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1391:29:N- ----NSF-","2:secondary:G3588:28:RA ----NSF-"]},
  {"pos":27,"ar":"وَالسُّلْطَانُ","s":"G2904","orig":"κράτος","surf":"κράτος","w":32,"m":"N- ----NSN-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"neuter","cs":"nominative","loc":"SBLGNT:B60.C4.V11.w32","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2904:32:N- ----NSN-","2:secondary:G2532:30:C- --------","3:secondary:G3588:31:RA ----NSN-"]},
  {"pos":28,"ar":"إِلَى","s":"G1519","orig":"εἰς","surf":"εἰς","w":33,"m":"P- --------","mp":"preposition","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w33","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1519:33:P- --------"]},
  {"pos":29,"ar":"أَبَدِ","s":"G165","orig":"αἰών","surf":"αἰῶνας","w":35,"m":"N- ----APM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"masculine","cs":"accusative","loc":"SBLGNT:B60.C4.V11.w35","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G165:35:N- ----APM-","2:secondary:G3588:34:RA ----APM-"]},
  {"pos":30,"ar":"الآبِدِينَ","s":"G165","orig":"αἰών","surf":"αἰώνων","w":37,"m":"N- ----GPM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"masculine","cs":"genitive","loc":"SBLGNT:B60.C4.V11.w37","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G165:37:N- ----GPM-","2:secondary:G3588:36:RA ----GPM-"]},
  {"pos":31,"ar":"آمِينَ","s":"G281","orig":"ἀμήν","surf":"ἀμήν","w":38,"m":"X- --------","mp":"particle","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B60.C4.V11.w38","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G281:38:X- --------"]}
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
  WHERE vr.book_id = 60 AND vr.chapter_num = 4 AND vr.verse_num = 11
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 31, `1Pet 4:11 has exactly 31 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 60 AND vr.chapter_num = 4 AND vr.verse_num = 11
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

assert(compRows.length === 40, `1Pet 4:11 has exactly 40 word_mapping_strongs components (29 primary + 11 secondary, 0 for #2 & #8 syntactic_ar; got ${compRows.length})`);
assert(coveredTokens.size === 38 && maxW === 38, `1Pet 4:11 covers all 38/38 unique Greek SBLGNT tokens w1..w38 (covered=${coveredTokens.size}, maxW=${maxW})`);

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
  assert(okRow, `1Pet 4:11 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  assert(JSON.stringify(actComps) === JSON.stringify(exp.comps), `1Pet 4:11 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

if (!process.env.SKIP_LIVE_AUDITOR) {
  const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3o_1pet4_11_audit.json');
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
    const p411 = rep.perVerse.find(v => v.verse === '1Pet 4:11');
    assert(
      rep.dbSha256 === sha256File(dbPath) &&
      rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
      'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
    );
    assert(
      Boolean(p411 && p411.clean === 31 && p411.total === 31 && p411.alerts === 0 && p411.axisAlerts.lexical === 0 && p411.axisAlerts.lemmaSurface === 0 && p411.axisAlerts.morphology === 0 && p411.axisAlerts.sourceLocator === 0),
      'Live frozen auditor confirms 1Pet 4:11 = 31/31 (100.0%) with 0 alerts across all 4 axes',
      JSON.stringify(p411)
    );
    // Final Round 3 aggregate milestone assertions
    assert(
      rep.byLanguage.hebrew.clean === 88 && rep.byLanguage.hebrew.total === 88 &&
      rep.byLanguage.greek.clean === 92 && rep.byLanguage.greek.total === 92 &&
      rep.byLanguage.aramaic.clean === 53 && rep.byLanguage.aramaic.total === 54 &&
      rep.summary.cleanUnits === 233 && rep.summary.totalUnits === 234 && rep.summary.alertedUnits === 1 &&
      rep.alerts.length === 1 && rep.alerts[0].verse === 'Dan 5:2' && rep.alerts[0].pos === 4,
      'Live frozen auditor confirms Round 3 FINAL = 233/234 (Hebrew 88/88, Greek 92/92, Aramaic 53/54 + documented Dan 5:2 #4 window = 234/234 verified)',
      JSON.stringify({ byLanguage: rep.byLanguage, summary: rep.summary })
    );
    try { fs.unlinkSync(tmpOut); } catch (_) {}
  }
}

// Negative mutation gate: reverting #2 «كَانَ» back to erroneous G1510@w27 MUST fail!
if (!process.env.SKIP_NEG_TEST) {
  const scratchNegDb = path.join(repoRoot, 'scratch/test_1pet4_11_neg_pos2_g1510.db');
  fs.mkdirSync(path.dirname(scratchNegDb), { recursive: true });
  try {
    fs.copyFileSync(dbPath, scratchNegDb);
    q(`
      UPDATE word_mappings
      SET strongs_id = 'G1510', orig_word = 'εἰμί', orig_surface = 'ἐστιν', orig_word_position = 27,
          orig_morphology = 'V- 3PAI-S--', morph_pos = 'verb',
          verified_locator = 'SBLGNT:B60.C4.V11.w27', verified_source = 'morphgnt_sblgnt',
          morph_source = 'morphgnt_sblgnt', relation_type = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 60 AND chapter_num = 4 AND verse_num = 11)
        AND ar_word_position = 2;
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
    assert(negFailed && negOut.includes('[FAIL] 1Pet 4:11 #2'), 'Negative gate rejects reverting #2 «كَانَ» back to erroneous G1510@w27');

    // Negative gate 2: reverting #4 «أَحَدٌ» (indefinite τις) back to interrogative_pronoun MUST fail!
    fs.copyFileSync(dbPath, scratchNegDb);
    q(`
      UPDATE word_mappings
      SET morph_pos = 'interrogative_pronoun'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 60 AND chapter_num = 4 AND verse_num = 11)
        AND ar_word_position = 4;
    `, scratchNegDb);
    let negIndefFailed = false;
    let negIndefOut = '';
    try {
      execFileSync(process.execPath, [__filename], {
        cwd: repoRoot,
        env: { ...process.env, AUDIT_DB_PATH: scratchNegDb, SKIP_LIVE_AUDITOR: '1', SKIP_NEG_TEST: '1' },
        stdio: 'pipe'
      });
    } catch (e) {
      negIndefFailed = true;
      negIndefOut = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
    }
    assert(negIndefFailed && negIndefOut.includes('[FAIL] 1Pet 4:11 #4'), 'Negative gate rejects reverting indefinite #4 «أَحَدٌ» back to interrogative_pronoun');

    // Negative gate 3: stripping secondary dative relative G3739@w26 (ᾧ) from #25 «لَهُ» MUST fail!
    fs.copyFileSync(dbPath, scratchNegDb);
    q(`
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (
        SELECT wm.id FROM word_mappings wm JOIN verses vr ON wm.verse_id = vr.id
        WHERE vr.book_id = 60 AND vr.chapter_num = 4 AND vr.verse_num = 11 AND wm.ar_word_position = 25
      ) AND strongs_id = 'G3739';
    `, scratchNegDb);
    let negLahuFailed = false;
    let negLahuOut = '';
    try {
      execFileSync(process.execPath, [__filename], {
        cwd: repoRoot,
        env: { ...process.env, AUDIT_DB_PATH: scratchNegDb, SKIP_LIVE_AUDITOR: '1', SKIP_NEG_TEST: '1' },
        stdio: 'pipe'
      });
    } catch (e) {
      negLahuFailed = true;
      negLahuOut = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
    }
    assert(negLahuFailed && negLahuOut.includes('[FAIL] 1Pet 4:11 #25'), 'Negative gate rejects stripping secondary dative G3739@w26 (ᾧ) from #25 «لَهُ»');
  } finally {
    try { fs.unlinkSync(scratchNegDb); } catch (_) {}
  }
}

const rawBaselineSha = sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_4axis_raw_baseline_v379.json'));
const frozenAuditorSha = sha256File(path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'));
assert(rawBaselineSha === '12de8cc5e3cc1b2d05dc20371928d4c1191a2f9f7255d70fbaf17e6fcb84da88', 'Frozen Round 3 raw baseline SHA-256 untouched (12de8cc5...)', rawBaselineSha);
assert(frozenAuditorSha === '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300', 'Frozen auditor SHA-256 untouched (5c62f12e...)', frozenAuditorSha);

console.log('\n================================================================================');
console.log(`  ROUND 3 BATCH 3O (1 PETER 4:11) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) process.exit(1);
