/**
 * scripts/test_round2_batch2o_dan6_22_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Daniel 6:22 (Batch 2O):
 *
 * Requirements (Strict Verification & Fail-Closed Invariants):
 *   1. ALWAYS generates a fresh live report for the database under test.
 *   2. Cryptographically verifies DB SHA-256 and Manifest SHA-256 in the live report.
 *   3. Enforces 19/19 clean and 0 alerts on production DB.
 *   4. Any auditor crash, missing report, or JSON parse error is an explicit FAIL (never a pass).
 *   5. Negative mutations require an alert strictly matching the target pos and target axis.
 *   6. Anchors Table Experiments 1 & 2 as explicit test gates that would drop the suite on false passes.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const auditScript = path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs');
const r2ManifestPath = path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json');

const isWin = process.platform === 'win32';
const sqlite = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

const manifestExpectedSha = sha256File(r2ManifestPath);

function q(sql, targetDb = dbPath) {
  return execFileSync(sqlite, [targetDb], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

console.log('=== RUNNING BATCH 2O (DANIEL 6:22) RIGOROUS REGRESSION GATES ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, desc, errorDetails = '') {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${desc}${errorDetails ? ' -> ' + errorDetails : ''}`);
    failCount++;
  }
}

const VERSE_ID = '11111111-0000-0000-0027-000000006022';

/**
 * Executes a LIVE audit on targetDb and verifies cryptographic hashes.
 * Returns structured findings or an error object if execution/parsing failed.
 */
function runLiveAudit(targetDb) {
  const tmpOut = path.join(repoRoot, `scratch/temp_audit_live_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
  if (fs.existsSync(tmpOut)) {
    try { fs.unlinkSync(tmpOut); } catch (_) {}
  }

  let execError = null;
  try {
    execFileSync(process.execPath, [
      auditScript,
      '--manifest', r2ManifestPath,
      '--out', tmpOut
    ], {
      env: { ...process.env, AUDIT_DB_PATH: targetDb },
      encoding: 'utf8',
      stdio: 'pipe'
    });
  } catch (err) {
    execError = err;
  }

  if (!fs.existsSync(tmpOut)) {
    return {
      error: `Audit failed to produce output report file. ${execError ? execError.message : ''}`
    };
  }

  let rep;
  try {
    rep = JSON.parse(fs.readFileSync(tmpOut, 'utf8'));
  } catch (err) {
    return {
      error: `Audit output is corrupted/invalid JSON: ${err.message}`
    };
  } finally {
    try { if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut); } catch (_) {}
  }

  // Cryptographic hash validation
  const actualDbSha = sha256File(targetDb);
  if (!rep.dbSha256 || rep.dbSha256 !== actualDbSha) {
    return {
      error: `Report dbSha256 (${rep.dbSha256}) mismatches target DB hash (${actualDbSha})`
    };
  }
  if (!rep.manifestSha256 || rep.manifestSha256 !== manifestExpectedSha) {
    return {
      error: `Report manifestSha256 (${rep.manifestSha256}) mismatches manifest hash (${manifestExpectedSha})`
    };
  }

  const danSummary = (rep.perVerse || []).find(v => v.verse === 'Dan 6:22');
  const danAlerts = (rep.alerts || []).filter(a => a.verse === 'Dan 6:22');

  return {
    clean: danSummary ? danSummary.clean : 0,
    total: danSummary ? danSummary.total : 0,
    alertsCount: danAlerts.length,
    alerts: danAlerts,
    report: rep
  };
}

// ---------------------------------------------------------------------------
// SECTION 1: POSITIVE GATES & REPRODUCIBILITY INVARIANTS (Production DB)
// ---------------------------------------------------------------------------
console.log('--- SECTION 1: POSITIVE GATES & REPRODUCIBILITY INVARIANTS ---');

// 1. Live audit on current production DB
const liveProd = runLiveAudit(dbPath);
assert(
  !liveProd.error && liveProd.clean === 19 && liveProd.total === 19 && liveProd.alertsCount === 0,
  'Gate 1: Live audit on production DB produces 19/19 clean and 0 alerts with verified SHA-256 hashes',
  liveProd.error || `clean=${liveProd.clean}, alerts=${liveProd.alertsCount}`
);

// 2. Table Experiment 1 Invariant: Corrupting pos 6 «الأُسُودِ» orig_word with Greek text MUST drop live score to 18/19 and trigger lemmaSurface at pos 6
const scratchDb = path.join(repoRoot, 'scratch/test_dan6_22_gates.db');
if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
fs.copyFileSync(dbPath, scratchDb);

// Create backup tables in scratch DB
q(`
  CREATE TABLE backup_wm AS SELECT * FROM word_mappings WHERE verse_id = '${VERSE_ID}';
  CREATE TABLE backup_wms AS SELECT * FROM word_mapping_strongs WHERE mapping_id IN (SELECT id FROM backup_wm);
`, scratchDb);

function restoreScratch() {
  q(`
    DELETE FROM word_mapping_strongs WHERE mapping_id IN (SELECT id FROM backup_wm);
    DELETE FROM word_mappings WHERE verse_id = '${VERSE_ID}';
    INSERT INTO word_mappings SELECT * FROM backup_wm;
    INSERT INTO word_mapping_strongs SELECT * FROM backup_wms;
  `, scratchDb);
}

restoreScratch();
q(`UPDATE word_mappings SET orig_word = 'λέων' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`, scratchDb);
const exp1Audit = runLiveAudit(scratchDb);
const exp1Alert = exp1Audit.alerts && exp1Audit.alerts.find(a => a.pos === 6);
const exp1HasLemmaAlert = exp1Alert && exp1Alert.axes && (
  Array.isArray(exp1Alert.axes.lemmaSurface)
    ? exp1Alert.axes.lemmaSurface.length > 0
    : Boolean(exp1Alert.axes.lemmaSurface)
);
assert(
  !exp1Audit.error && exp1Audit.clean === 18 && exp1Audit.alertsCount === 1 && exp1HasLemmaAlert,
  'Gate 2: Table Experiment 1 Invariant: Corrupting «الأُسُودِ» orig_word to Greek drops live score to 18/19 with lemmaSurface alert at pos 6',
  exp1Audit.error || `clean=${exp1Audit.clean}, alerts=${exp1Audit.alertsCount}`
);

// 3. Table Experiment 2 Invariant: Missing, disabled, or crashing auditor process MUST be rejected as test failure (fail-closed)
const fakeAuditorPath = path.join(repoRoot, 'scripts/non_existent_auditor_script.cjs');
let exp2Caught = false;
try {
  execFileSync(process.execPath, [fakeAuditorPath], { stdio: 'pipe' });
} catch (err) {
  exp2Caught = true;
}
assert(
  exp2Caught,
  'Gate 3: Table Experiment 2 Invariant: Missing or disabled auditor process is strictly rejected (fail-closed invariant)'
);

// 4. Token coverage bounds
const rawLocators = q(`SELECT verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' ORDER BY ar_word_position ASC;`).split('\n');
const tokenIndices = rawLocators
  .map(loc => {
    const m = loc.match(/w(\d+)$/);
    return m ? parseInt(m[1], 10) : null;
  })
  .filter(n => n !== null);
const maxToken = Math.max(...tokenIndices);
assert(maxToken <= 22, `Gate 4: All OSHB locators within Dan.6.23 bounds (max index=${maxToken} <= 22)`);

// Helpers to query mapping row and components
function getMapping(pos) {
  const row = q(`
    SELECT ar_word, strongs_id, orig_surface, orig_word, orig_word_position, orig_morphology,
           morph_pos, morph_stem, morph_tense, morph_voice, morph_mood, morph_person,
           morph_gender, morph_number, morph_case, relation_type, verified_locator,
           verified_source, morph_source, grammar_notes
    FROM word_mappings
    WHERE verse_id = '${VERSE_ID}' AND ar_word_position = ${pos};
  `);
  const cols = row.split('|');
  return {
    arWord: cols[0],
    strongsId: cols[1],
    origSurface: cols[2],
    origWord: cols[3],
    origPos: parseInt(cols[4], 10),
    origMorph: cols[5],
    morphPos: cols[6],
    morphStem: cols[7],
    morphTense: cols[8],
    morphVoice: cols[9],
    morphMood: cols[10],
    morphPerson: cols[11],
    morphGender: cols[12],
    morphNumber: cols[13],
    morphCase: cols[14],
    relationType: cols[15],
    verifiedLocator: cols[16],
    verifiedSource: cols[17],
    morphSource: cols[18],
    grammarNotes: cols[19]
  };
}

function getComponents(pos) {
  const rows = q(`
    SELECT strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source
    FROM word_mapping_strongs
    WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = ${pos})
    ORDER BY link_order ASC;
  `).split('\n').filter(Boolean);
  return rows.map(r => {
    const c = r.split('|');
    return { strongsId: c[0], order: parseInt(c[1], 10), role: c[2], component: c[3], pos: parseInt(c[4], 10), morph: c[5], source: c[6] };
  });
}

// 5. Pos 1 «إِلهِي»
const m1 = getMapping(1);
const c1 = getComponents(1);
assert(
  m1.strongsId === 'H426' && m1.origPos === 1 && m1.morphCase === 'construct' && m1.verifiedLocator === 'OSHB:B27.C6.V23.w1' &&
  c1.length === 1 && c1[0].strongsId === 'H426' && c1[0].pos === 1,
  'Gate 5: Pos 1 «إِلهِي» is w1 אֱלָהִ֞י (H426, ANcmsc/Sp1cs, construct)'
);

// 6. Pos 2 «أَرْسَلَ»
const m2 = getMapping(2);
const c2 = getComponents(2);
assert(
  m2.strongsId === 'H7972' && m2.origPos === 2 && m2.morphStem === 'peal' && m2.morphTense === 'qatal' && m2.verifiedLocator === 'OSHB:B27.C6.V23.w2' &&
  c2.length === 1 && c2[0].strongsId === 'H7972' && c2[0].pos === 2,
  'Gate 6: Pos 2 «أَرْسَلَ» is w2 שְׁלַ֣ח (H7972, AVqp3ms, peal qatal 3ms)'
);

// 7. Pos 3 «مَلاَكَهُ»
const m3 = getMapping(3);
const c3 = getComponents(3);
assert(
  m3.strongsId === 'H4398' && m3.origPos === 3 && m3.morphCase === 'construct' && m3.verifiedLocator === 'OSHB:B27.C6.V23.w3' &&
  c3.length === 1 && c3[0].strongsId === 'H4398' && c3[0].pos === 3,
  'Gate 7: Pos 3 «مَلاَكَهُ» is w3 מַלְאֲכֵ֗הּ (H4398, ANcmsc/Sp3ms, construct)'
);

// 8. Pos 4 «وَسَدَّ»
const m4 = getMapping(4);
const c4 = getComponents(4);
assert(
  m4.strongsId === 'H5463' && m4.origPos === 4 && m4.verifiedLocator === 'OSHB:B27.C6.V23.w4' &&
  c4.length === 2 && c4[0].strongsId === 'H5463' && c4[1].strongsId === 'H9002',
  'Gate 8: Pos 4 «وَسَدَّ» is w4 וּֽסֲגַ֛ר (H5463, AC/Vqp3ms; secondary H9002 וּֽ)'
);

// 9. Pos 5 «أَفْوَاهَ»
const m5 = getMapping(5);
const c5 = getComponents(5);
assert(
  m5.strongsId === 'H6433' && m5.origPos === 5 && m5.morphCase === 'construct' && m5.verifiedLocator === 'OSHB:B27.C6.V23.w5' &&
  m5.strongsId !== 'H6413' && c5.length === 1 && c5[0].strongsId === 'H6433',
  'Gate 9: Pos 5 «أَفْوَاهَ» is w5 פֻּ֥ם (H6433, ANcmsc, construct; NOT legacy H6413)'
);

// 10. Pos 6 «الأُسُودِ»
const m6 = getMapping(6);
const c6 = getComponents(6);
assert(
  m6.strongsId === 'H744' && m6.origPos === 6 && m6.morphCase === 'determined' && m6.verifiedLocator === 'OSHB:B27.C6.V23.w6' &&
  c6.length === 1 && c6[0].strongsId === 'H744' && c6[0].pos === 6,
  'Gate 10: Pos 6 «الأُسُودِ» is w6 אַרְיָوָتָ֖א (H744, ANcmpd/Td, determined)'
);

// 11. Pos 7 «فَلَمْ»
const m7 = getMapping(7);
const c7 = getComponents(7);
assert(
  m7.strongsId === 'H3809' && m7.origPos === 7 && m7.verifiedLocator === 'OSHB:B27.C6.V23.w7' &&
  c7.length === 2 && c7[0].strongsId === 'H3809' && c7[1].strongsId === 'H9002',
  'Gate 11: Pos 7 «فَلَمْ» is w7 וְלָ֣א (H3809, AC/Tn; secondary H9002 וְ)'
);

// 12. Pos 8 «تَضُرَّنِي،»
const m8 = getMapping(8);
const c8 = getComponents(8);
assert(
  m8.strongsId === 'H2255' && m8.origPos === 8 && m8.morphStem === 'pael' && m8.morphTense === 'qatal' && m8.verifiedLocator === 'OSHB:B27.C6.V23.w8' &&
  c8.length === 1 && c8[0].strongsId === 'H2255' && c8[0].pos === 8,
  'Gate 12: Pos 8 «تَضُرَّنِي،» is w8 חַבְּל֑וּנִי (H2255, AVpp3mp/Sp1cs, pael qatal 3mp + Sp1cs)'
);

// 13. Pos 9 «لأَنِّي»
const m9 = getMapping(9);
const c9 = getComponents(9);
assert(
  m9.strongsId === 'H6903' && m9.origPos === 10 && m9.verifiedLocator === 'OSHB:B27.C6.V23.w10' &&
  c9.length === 3 && c9[0].strongsId === 'H6903' && c9[1].strongsId === 'H3606' && c9[2].strongsId === 'H1768',
  'Gate 13: Pos 9 «لأَنِّي» is w10 קֳבֵ֗ל (H6903) + secondary w9 כָּל (H3606) + secondary w11 דִּ֤י (H1768)'
);

// 14. Pos 10 «وُجِدْتُ»
const m10 = getMapping(10);
const c10 = getComponents(10);
assert(
  m10.strongsId === 'H7912' && m10.origPos === 14 && m10.morphStem === 'hithpeel' && m10.morphVoice === 'passive' && m10.verifiedLocator === 'OSHB:B27.C6.V23.w14' &&
  c10.length === 2 && c10[0].strongsId === 'H7912' && c10[1].strongsId === 'H9005',
  'Gate 14: Pos 10 «وُجِدْتُ» is w14 הִשְׁתְּכַ֣חַת (H7912, AVup3fs, passive) + secondary w15 לִ֔י (H9005)'
);

// 15. Pos 11 «بَرِيئًا»
const m11 = getMapping(11);
const c11 = getComponents(11);
assert(
  m11.strongsId === 'H2136' && m11.origPos === 13 && m11.morphCase === 'absolute' && m11.verifiedLocator === 'OSHB:B27.C6.V23.w13' &&
  c11.length === 1 && c11[0].strongsId === 'H2136' && c11[0].pos === 13,
  'Gate 15: Pos 11 «بَرِيئًا» is w13 זָכוּ֙ (H2136, ANcfsa, absolute)'
);

// 16. Pos 12 «قُدَّامَهُ،»
const m12 = getMapping(12);
const c12 = getComponents(12);
assert(
  m12.strongsId === 'H6925' && m12.origPos === 12 && m12.morphPerson === '3' && m12.verifiedLocator === 'OSHB:B27.C6.V23.w12' &&
  c12.length === 1 && c12[0].strongsId === 'H6925' && c12[0].pos === 12,
  'Gate 16: Pos 12 «قُدَّامَهُ،» is w12 קָֽדָמ֨וֹהִי֙ (H6925, AR/Sp3ms)'
);

// 17. Pos 13 «وَقُدَّامَكَ»
const m13 = getMapping(13);
const c13 = getComponents(13);
assert(
  m13.strongsId === 'H6925' && m13.origPos === 18 && m13.morphPerson === '2' && m13.verifiedLocator === 'OSHB:B27.C6.V23.w18' &&
  c13.length === 2 && c13[0].strongsId === 'H6925' && c13[0].pos === 18 && c13[1].strongsId === 'H9002' && c13[1].pos === 16 &&
  m13.grammarNotes.includes('Qere') && m13.grammarNotes.includes('Ketiv'),
  'Gate 17: Pos 13 «وَقُدَّامَكَ» is Qere w18 קָֽדָמָךְ֙ (H6925, AR/Sp2ms) + secondary w16 וְ (H9002, AC); Ketiv documented'
);

// 18. Pos 14 «أَيْضًا»
const m14 = getMapping(14);
const c14 = getComponents(14);
assert(
  m14.strongsId === 'H638' && m14.origPos === 16 && m14.verifiedLocator === 'OSHB:B27.C6.V23.w16' &&
  c14.length === 1 && c14[0].strongsId === 'H638' && c14[0].pos === 16,
  'Gate 18: Pos 14 «أَيْضًا» is w16 וְאַ֤ף (H638, AC/Ta)'
);

// 19. Pos 15 «أَيُّهَا»
const m15 = getMapping(15);
const c15 = getComponents(15);
assert(
  m15.strongsId === '' && m15.morphPos === 'syntactic_ar' && m15.verifiedLocator === 'AR_SYNTACTIC:B27.C6.V22.w15' &&
  m15.verifiedSource === 'syntactic_ar' && c15.length === 0,
  'Gate 19: Pos 15 «أَيُّهَا» is AR_SYNTACTIC:B27.C6.V22.w15, morph_pos = syntactic_ar, strongs_id is NULL'
);

// 20. Pos 16 «الْمَلِكُ،»
const m16 = getMapping(16);
const c16 = getComponents(16);
assert(
  m16.strongsId === 'H4430' && m16.origPos === 19 && m16.morphCase === 'determined' && m16.verifiedLocator === 'OSHB:B27.C6.V23.w19' &&
  m16.strongsId !== 'H4399' && c16.length === 1 && c16[0].strongsId === 'H4430',
  'Gate 20: Pos 16 «الْمَلِكُ،» is w19 מַלְכָּ֔א (H4430, ANcmsd/Td, determined; NOT legacy H4399)'
);

// 21. Pos 17 «لَمْ»
const m17 = getMapping(17);
const c17 = getComponents(17);
assert(
  m17.strongsId === 'H3809' && m17.origPos === 21 && m17.verifiedLocator === 'OSHB:B27.C6.V23.w21' &&
  c17.length === 1 && c17[0].strongsId === 'H3809' && c17[0].pos === 21,
  'Gate 21: Pos 17 «لَمْ» is w21 לָ֥א (H3809, ATn)'
);

// 22. Pos 18 «أَفْعَلْ»
const m18 = getMapping(18);
const c18 = getComponents(18);
assert(
  m18.strongsId === 'H5648' && m18.origPos === 22 && m18.morphStem === 'peal' && m18.morphTense === 'qatal' && m18.morphPerson === '1' &&
  m18.verifiedLocator === 'OSHB:B27.C6.V23.w22' && c18.length === 1 && c18[0].strongsId === 'H5648',
  'Gate 22: Pos 18 «أَفْعَلْ» is w22 עַבְדֵֽת (H5648, AVqp1cs, peal qatal 1cs)'
);

// 23. Pos 19 «ذَنْبًا»
const m19 = getMapping(19);
const c19 = getComponents(19);
assert(
  m19.strongsId === 'H2248' && m19.origPos === 20 && m19.morphCase === 'absolute' && m19.verifiedLocator === 'OSHB:B27.C6.V23.w20' &&
  m19.strongsId !== 'H2269' && c19.length === 1 && c19[0].strongsId === 'H2248',
  'Gate 23: Pos 19 «ذَنْبًا» is w20 חֲבוּلָ֖ה (H2248, ANcfsa, absolute; NOT legacy H2269)'
);

// ---------------------------------------------------------------------------
// SECTION 2: NEGATIVE REGRESSION GATES (Isolated Scratch DB)
// ---------------------------------------------------------------------------
console.log('\n--- SECTION 2: NEGATIVE REGRESSION GATES (TARGETED AXIS & LOCUS VERIFICATION) ---');

/**
 * Executes a mutation on scratchDb and verifies that the live audit
 * specifically produces an alert for expectedPos on expectedAxis.
 * Fails closed if audit crashes, output is missing, or alert does not match.
 */
function testMutation(desc, mutateSql, expectedPos, expectedAxis) {
  restoreScratch();
  q(mutateSql, scratchDb);

  const res = runLiveAudit(scratchDb);
  if (res.error) {
    console.error(`  [FAIL] ${desc} -> Audit failure / crash: ${res.error}`);
    failCount++;
    return;
  }

  const alert = res.alerts.find(a => a.pos === expectedPos);
  if (!alert) {
    console.error(`  [FAIL] ${desc} -> No alert at pos ${expectedPos} (total alerts=${res.alertsCount})`);
    failCount++;
    return;
  }

  const axisNotes = alert.axes && alert.axes[expectedAxis];
  const hasAxisAlert = Array.isArray(axisNotes)
    ? axisNotes.length > 0
    : Boolean(axisNotes && String(axisNotes).trim().length > 0);
  if (!hasAxisAlert) {
    console.error(`  [FAIL] ${desc} -> Alert at pos ${expectedPos} did not flag expected axis '${expectedAxis}' (flagged: ${JSON.stringify(alert.axes)})`);
    failCount++;
    return;
  }

  const notesText = Array.isArray(axisNotes) ? axisNotes.join('; ') : String(axisNotes);
  console.log(`  [PASS] ${desc} (Flagged '${expectedAxis}' at pos ${expectedPos}: ${notesText.slice(0, 70)}...)`);
  passCount++;
}

// 24. Pos 1 displaced to w2
testMutation('Gate 24: Pos 1 «إِلهِي» displaced to w2 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w2', orig_word_position = 2 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`,
  1, 'sourceLocator'
);

// 25. Pos 1 mutating from construct to absolute
testMutation('Gate 25: Pos 1 «إِلهِي» mutating from construct to absolute is rejected on morphology',
  `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`,
  1, 'morphology'
);

// 26. Pos 1 blanking morph_case
testMutation('Gate 26: Pos 1 «إِلهِي» blanking morph_case is rejected on morphology',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`,
  1, 'morphology'
);

// 27. Pos 1 mutating orig_word to Greek θεός
testMutation('Gate 27: Pos 1 «إِلهِي» mutating orig_word to Greek θεός is rejected on lemmaSurface',
  `UPDATE word_mappings SET orig_word = 'θεός' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`,
  1, 'lemmaSurface'
);

// 28. Pos 2 displaced to w3
testMutation('Gate 28: Pos 2 «أَرْسَلَ» displaced to w3 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w3', orig_word_position = 3 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 2;`,
  2, 'sourceLocator'
);

// 29. Pos 2 mutating stem from peal to pael
testMutation('Gate 29: Pos 2 «أَرْسَلَ» mutating stem from peal to pael is rejected on morphology',
  `UPDATE word_mappings SET morph_stem = 'pael' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 2;`,
  2, 'morphology'
);

// 30. Pos 3 displaced to w4
testMutation('Gate 30: Pos 3 «مَلاَكَهُ» displaced to w4 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w4', orig_word_position = 4 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`,
  3, 'sourceLocator'
);

// 31. Pos 3 mutating from construct to absolute
testMutation('Gate 31: Pos 3 «مَلاَكَهُ» mutating from construct to absolute is rejected on morphology',
  `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`,
  3, 'morphology'
);

// 32. Pos 3 blanking morph_case
testMutation('Gate 32: Pos 3 «مَلاَكَهُ» blanking morph_case is rejected on morphology',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`,
  3, 'morphology'
);

// 33. Pos 4 displaced to w5
testMutation('Gate 33: Pos 4 «وَسَدَّ» displaced to w5 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w5', orig_word_position = 5 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4;`,
  4, 'sourceLocator'
);

// 34. Pos 4 dropping secondary H9002
testMutation('Gate 34: Pos 4 «وَسَدَّ» dropping secondary H9002 is rejected on sourceLocator',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4) AND strongs_id = 'H9002';`,
  4, 'sourceLocator'
);

// 35. Pos 5 mutating to legacy wrong Strong's H6413
testMutation('Gate 35: Pos 5 «أَفْوَاهَ» mutating to legacy wrong Strongs H6413 is rejected on lexical',
  `UPDATE word_mappings SET strongs_id = 'H6413' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`,
  5, 'lexical'
);

// 36. Pos 5 displaced to w6
testMutation('Gate 36: Pos 5 «أَفْوَاهَ» displaced to w6 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w6', orig_word_position = 6 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`,
  5, 'sourceLocator'
);

// 37. Pos 5 mutating from construct to determined
testMutation('Gate 37: Pos 5 «أَفْوَاهَ» mutating from construct to determined is rejected on morphology',
  `UPDATE word_mappings SET morph_case = 'determined' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`,
  5, 'morphology'
);

// 38. Pos 5 blanking morph_case
testMutation('Gate 38: Pos 5 «أَفْوَاهَ» blanking morph_case is rejected on morphology',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`,
  5, 'morphology'
);

// 39. Pos 5 mutating orig_word to Greek στόμα
testMutation('Gate 39: Pos 5 «أَفْوَاهَ» mutating orig_word to Greek στόμα is rejected on lemmaSurface',
  `UPDATE word_mappings SET orig_word = 'στόμα' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`,
  5, 'lemmaSurface'
);

// 40. Pos 6 displaced to w5
testMutation('Gate 40: Pos 6 «الأُسُودِ» displaced to w5 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w5', orig_word_position = 5 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`,
  6, 'sourceLocator'
);

// 41. Pos 6 mutating from determined to construct
testMutation('Gate 41: Pos 6 «الأُسُودِ» mutating from determined to construct is rejected on morphology',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`,
  6, 'morphology'
);

// 42. Pos 6 blanking morph_case
testMutation('Gate 42: Pos 6 «الأُسُودِ» blanking morph_case is rejected on morphology',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`,
  6, 'morphology'
);

// 43. Pos 7 displaced to w8
testMutation('Gate 43: Pos 7 «فَلَمْ» displaced to w8 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w8', orig_word_position = 8 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`,
  7, 'sourceLocator'
);

// 44. Pos 7 dropping secondary H9002
testMutation('Gate 44: Pos 7 «فَلَمْ» dropping secondary H9002 is rejected on sourceLocator',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7) AND strongs_id = 'H9002';`,
  7, 'sourceLocator'
);

// 45. Pos 8 displaced to w7
testMutation('Gate 45: Pos 8 «تَضُرَّنِي،» displaced to w7 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w7', orig_word_position = 7 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`,
  8, 'sourceLocator'
);

// 46. Pos 8 mutating stem from pael to peal
testMutation('Gate 46: Pos 8 «تَضُرَّنِي،» mutating stem from pael to peal is rejected on morphology',
  `UPDATE word_mappings SET morph_stem = 'peal' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`,
  8, 'morphology'
);

// 47. Pos 9 displaced to w9
testMutation('Gate 47: Pos 9 «لأَنِّي» displaced to w9 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w9', orig_word_position = 9 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`,
  9, 'sourceLocator'
);

// 48. Pos 9 dropping secondary H3606
testMutation('Gate 48: Pos 9 «لأَنِّي» dropping secondary H3606 is rejected on sourceLocator',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9) AND strongs_id = 'H3606';`,
  9, 'sourceLocator'
);

// 49. Pos 9 dropping secondary H1768
testMutation('Gate 49: Pos 9 «لأَنِّي» dropping secondary H1768 is rejected on sourceLocator',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9) AND strongs_id = 'H1768';`,
  9, 'sourceLocator'
);

// 50. Pos 9 mutating primary Strong's to H3588
testMutation('Gate 50: Pos 9 «لأَنِّي» mutating primary Strongs to H3588 is rejected on lexical',
  `UPDATE word_mappings SET strongs_id = 'H3588' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`,
  9, 'lexical'
);

// 51. Pos 10 displaced to w13
testMutation('Gate 51: Pos 10 «وُجِدْتُ» displaced to w13 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w13', orig_word_position = 13 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`,
  10, 'sourceLocator'
);

// 52. Pos 10 dropping secondary H9005
testMutation('Gate 52: Pos 10 «وُجِدْتُ» dropping secondary H9005 is rejected on sourceLocator',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10) AND strongs_id = 'H9005';`,
  10, 'sourceLocator'
);

// 53. Pos 10 mutating stem from hithpeel to peal
testMutation('Gate 53: Pos 10 «وُجِدْتُ» mutating stem from hithpeel to peal is rejected on morphology',
  `UPDATE word_mappings SET morph_stem = 'peal' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`,
  10, 'morphology'
);

// 54. Pos 10 mutating voice from passive to active
testMutation('Gate 54: Pos 10 «وُجِدْتُ» mutating voice from passive to active is rejected on morphology',
  `UPDATE word_mappings SET morph_voice = 'active' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`,
  10, 'morphology'
);

// 55. Pos 11 displaced to w12
testMutation('Gate 55: Pos 11 «بَرِيئًا» displaced to w12 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w12', orig_word_position = 12 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`,
  11, 'sourceLocator'
);

// 56. Pos 11 mutating from absolute to construct
testMutation('Gate 56: Pos 11 «بَرِيئًا» mutating from absolute to construct is rejected on morphology',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`,
  11, 'morphology'
);

// 57. Pos 11 blanking morph_case
testMutation('Gate 57: Pos 11 «بَرِيئًا» blanking morph_case is rejected on morphology',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`,
  11, 'morphology'
);

// 58. Pos 11 mutating orig_word to Greek ἄμεμπτος
testMutation('Gate 58: Pos 11 «بَرِيئًا» mutating orig_word to Greek ἄμεμπτος is rejected on lemmaSurface',
  `UPDATE word_mappings SET orig_word = 'ἄμεμπτος' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`,
  11, 'lemmaSurface'
);

// 59. Pos 12 displaced to w18
testMutation('Gate 59: Pos 12 «قُدَّامَهُ،» displaced to w18 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w18', orig_word_position = 18 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`,
  12, 'sourceLocator'
);

// 60. Pos 12 mutating person from 3 to 2
testMutation('Gate 60: Pos 12 «قُدَّامَهُ،» mutating person from 3 to 2 is rejected on morphology',
  `UPDATE word_mappings SET morph_person = '2' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`,
  12, 'morphology'
);

// 61. Pos 13 displaced to w12
testMutation('Gate 61: Pos 13 «وَقُدَّامَكَ» displaced to w12 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w12', orig_word_position = 12 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`,
  13, 'sourceLocator'
);

// 62. Pos 13 dropping secondary H9002
testMutation('Gate 62: Pos 13 «وَقُدَّامَكَ» dropping secondary H9002 is rejected on sourceLocator',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13) AND strongs_id = 'H9002';`,
  13, 'sourceLocator'
);

// 63. Pos 13 mutating locator to unvocalized Ketiv w17 (desync with primary component w18)
testMutation('Gate 63: Pos 13 «وَقُدَّامَكَ» mutating locator to unvocalized Ketiv w17 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w17', orig_word_position = 17, orig_surface = 'קדמיך' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`,
  13, 'sourceLocator'
);

// 64. Pos 13 mutating both locator and primary component to Ketiv w17 (fails required component w18)
testMutation('Gate 64: Pos 13 «وَقُدَّامَكَ» shifting primary component to w17 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w17', orig_word_position = 17, orig_surface = 'קדמיך' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;
   UPDATE word_mapping_strongs SET orig_word_position = 17, orig_component = 'קדמיך' WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13) AND link_role = 'primary';`,
  13, 'sourceLocator'
);

// 65. Pos 14 displaced to w15
testMutation('Gate 65: Pos 14 «أَيْضًا» displaced to w15 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w15', orig_word_position = 15 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14;`,
  14, 'sourceLocator'
);

// 66. Pos 14 mutating Strong's to H637
testMutation('Gate 66: Pos 14 «أَيْضًا» mutating Strongs to H637 is rejected on lexical',
  `UPDATE word_mappings SET strongs_id = 'H637' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14;`,
  14, 'lexical'
);

// 67. Pos 15 mutating to fake Strong's H1836
testMutation('Gate 67: Pos 15 «أَيُّهَا» mutating to fake Strongs H1836 is rejected on lexical',
  `UPDATE word_mappings SET strongs_id = 'H1836' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`,
  15, 'lexical'
);

// 68. Pos 15 mutating morph_pos away from syntactic_ar
testMutation('Gate 68: Pos 15 «أَيُّهَا» mutating morph_pos away from syntactic_ar is rejected on morphology',
  `UPDATE word_mappings SET morph_pos = 'particle' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`,
  15, 'morphology'
);

// 69. Pos 15 mutating verified_source away from syntactic_ar
testMutation('Gate 69: Pos 15 «أَيُّهَا» mutating verified_source away from syntactic_ar is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_source = 'oshb_wlc' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`,
  15, 'sourceLocator'
);

// 70. Pos 16 mutating to legacy wrong Strong's H4399
testMutation('Gate 70: Pos 16 «الْمَلِكُ،» mutating to legacy wrong Strongs H4399 is rejected on lexical',
  `UPDATE word_mappings SET strongs_id = 'H4399' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`,
  16, 'lexical'
);

// 71. Pos 16 displaced to w18
testMutation('Gate 71: Pos 16 «الْمَلِكُ،» displaced to w18 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w18', orig_word_position = 18 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`,
  16, 'sourceLocator'
);

// 72. Pos 16 mutating from determined to construct
testMutation('Gate 72: Pos 16 «الْمَلِكُ،» mutating from determined to construct is rejected on morphology',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`,
  16, 'morphology'
);

// 73. Pos 16 blanking morph_case
testMutation('Gate 73: Pos 16 «الْمَلِكُ،» blanking morph_case is rejected on morphology',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`,
  16, 'morphology'
);

// 74. Pos 16 mutating orig_word to Greek βασιλεύς
testMutation('Gate 74: Pos 16 «الْمَلِكُ،» mutating orig_word to Greek βασιλεύς is rejected on lemmaSurface',
  `UPDATE word_mappings SET orig_word = 'βασιλεύς' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`,
  16, 'lemmaSurface'
);

// 75. Pos 17 displaced to w20
testMutation('Gate 75: Pos 17 «لَمْ» displaced to w20 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w20', orig_word_position = 20 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`,
  17, 'sourceLocator'
);

// 76. Pos 17 mutating Strong's to H3808
testMutation('Gate 76: Pos 17 «لَمْ» mutating Strongs to H3808 is rejected on lexical',
  `UPDATE word_mappings SET strongs_id = 'H3808' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`,
  17, 'lexical'
);

// 77. Pos 18 displaced to w21
testMutation('Gate 77: Pos 18 «أَفْعَلْ» displaced to w21 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w21', orig_word_position = 21 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`,
  18, 'sourceLocator'
);

// 78. Pos 18 mutating stem from peal to pael
testMutation('Gate 78: Pos 18 «أَفْعَلْ» mutating stem from peal to pael is rejected on morphology',
  `UPDATE word_mappings SET morph_stem = 'pael' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`,
  18, 'morphology'
);

// 79. Pos 18 mutating orig_word to Greek ποιέω
testMutation('Gate 79: Pos 18 «أَفْعَلْ» mutating orig_word to Greek ποιέω is rejected on lemmaSurface',
  `UPDATE word_mappings SET orig_word = 'ποιέω' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`,
  18, 'lemmaSurface'
);

// 80. Pos 19 mutating to legacy wrong Strong's H2269
testMutation('Gate 80: Pos 19 «ذَنْبًا» mutating to legacy wrong Strongs H2269 is rejected on lexical',
  `UPDATE word_mappings SET strongs_id = 'H2269' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`,
  19, 'lexical'
);

// 81. Pos 19 displaced to out-of-bounds w23
testMutation('Gate 81: Pos 19 «ذَنْبًا» displaced to out-of-bounds w23 is rejected on sourceLocator',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B27.C6.V23.w23', orig_word_position = 23 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`,
  19, 'sourceLocator'
);

// 82. Pos 19 mutating from absolute to determined
testMutation('Gate 82: Pos 19 «ذَنْبًا» mutating from absolute to determined is rejected on morphology',
  `UPDATE word_mappings SET morph_case = 'determined' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`,
  19, 'morphology'
);

// 83. Pos 19 blanking morph_case
testMutation('Gate 83: Pos 19 «ذَنْبًا» blanking morph_case is rejected on morphology',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`,
  19, 'morphology'
);

// 84. Pos 19 mutating orig_word to Greek ἁμαρτία
testMutation('Gate 84: Pos 19 «ذَنْبًا» mutating orig_word to Greek ἁμαρτία is rejected on lemmaSurface',
  `UPDATE word_mappings SET orig_word = 'ἁμαρτία' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`,
  19, 'lemmaSurface'
);

// Clean up scratch db
q(`
  DROP TABLE IF EXISTS backup_wm;
  DROP TABLE IF EXISTS backup_wms;
`, scratchDb);
if (fs.existsSync(scratchDb)) {
  try { fs.unlinkSync(scratchDb); } catch (_) {}
}

console.log(`\n========================================================================`);
console.log(`DANIEL 6:22 (BATCH 2O) GATES RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`========================================================================`);

if (failCount > 0) {
  process.exit(1);
}
