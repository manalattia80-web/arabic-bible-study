/**
 * test_alignment_engine_gates.cjs
 * Regression gates for alignment_suggestion_engine.cjs:
 *   1. Rom 5:8 ("بَيَّنَ") MUST NOT propose preposition G1519 (εἰς).
 *   2. Ezra 5:11 ("قَبْلَ") MUST NOT propose verb H1124 (בְנֵה).
 *   3. Luke 19:10 ("قَدْ") MUST NOT propose noun G5207 (υἱός).
 *   4. 1Kgs 19:12 ("النَّارِ") & Ezra 5:11 ("الَّذِي") MUST NOT be labeled VERIFIED_CLEAN while carrying alerts.
 *   5. Every VERIFIED_CLEAN unit MUST have zero alerts in the strict locator+axes audit.
 *   6. Provenance hashes (dbSha256, manifestSha256, exclusionKeysSha256) MUST be present.
 */
const fs = require('fs');
const path = require('path');

const prop = JSON.parse(fs.readFileSync(path.join(__dirname, 'round2_alignment_proposals.json'), 'utf8'));
const fixedAudit = JSON.parse(fs.readFileSync(path.join(__dirname, 'unseen_holdout_round2_4axis_v379_locator_and_axes_fixed.json'), 'utf8'));
const alertKeys = new Set((fixedAudit.alerts || []).map(a => `${a.verse}#${a.pos}`));

let passed = 0, total = 0;
function check(name, cond, detail) {
  total++;
  if (cond) {
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    console.error(`  ✗ [FAIL] ${name} -> ${detail}`);
  }
}

check('Provenance hashes present in proposal report', Boolean(prop.dbSha256 && prop.manifestSha256 && prop.exclusionKeysSha256 && prop.version), `db=${prop.dbSha256}`);

const getUnit = (verse, arPos) => {
  const v = prop.verses.find(x => x.verse === verse);
  return v ? v.units.find(u => u.arPos === arPos) : null;
};

// Gate A: Rom 5:8 بَيَّنَ must NOT propose G1519
const rom58 = prop.verses.find(v => v.verse === 'Rom 5:8');
const romBayyana = rom58.units.find(u => u.arWord.includes('بَي'));
check('Rom 5:8 "بَيَّنَ" does NOT propose G1519 (εἰς)', Boolean(romBayyana) && !(romBayyana.status === 'PROPOSED_REPAIR' && romBayyana.proposed && romBayyana.proposed.strongsId === 'G1519'), JSON.stringify(romBayyana));

// Gate B: Ezra 5:11 قَبْلَ must NOT propose H1124
const ezra511 = prop.verses.find(v => v.verse === 'Ezra 5:11');
const ezraQabl = ezra511.units.find(u => u.arWord.includes('قَبْل'));
check('Ezra 5:11 "قَبْلَ" does NOT propose H1124 (בְנֵה)', Boolean(ezraQabl) && !(ezraQabl.status === 'PROPOSED_REPAIR' && ezraQabl.proposed && ezraQabl.proposed.strongsId === 'H1124'), JSON.stringify(ezraQabl));

// Gate C: Luke 19:10 قَدْ must NOT propose G5207 (tested on Luke 19:10 or synthetic/engine check)
const { execFileSync } = require('child_process');
const lukeOut = path.join(__dirname, '../scratch/r1_proposals_check.json');
execFileSync(process.execPath, [
  path.join(__dirname, 'alignment_suggestion_engine.cjs'),
  '--manifest', path.join(__dirname, 'unseen_holdout_15_verses_manifest.json'),
  '--out', lukeOut
], { stdio: 'ignore' });
const r1Prop = JSON.parse(fs.readFileSync(lukeOut, 'utf8'));
const luke1910 = r1Prop.verses.find(v => v.verse === 'Luke 19:10');
const lukeQad = luke1910.units.find(u => u.arWord === 'قَدْ');
check('Luke 19:10 "قَدْ" does NOT propose G5207 (υἱός)', Boolean(lukeQad) && !(lukeQad.proposed && lukeQad.proposed.strongsId === 'G5207'), JSON.stringify(lukeQad));

// Gate D: 1Kgs 19:12 "النَّارِ" & Ezra 5:11 "الَّذِي" not VERIFIED_CLEAN while dirty
const kgsFire = prop.verses.find(v => v.verse === '1Kgs 19:12').units.find(u => u.arWord.includes('النَّار') || u.arWord.includes('النار') || u.arWord.includes('النَّار'));
const ezraAlladhi = ezra511.units.find(u => u.arWord.includes('الَّذ') || u.arWord.includes('الَّذ'));
check('1Kgs 19:12 "النَّارِ" NOT VERIFIED_CLEAN while carrying alerts', Boolean(kgsFire) && kgsFire.status !== 'VERIFIED_CLEAN', kgsFire ? kgsFire.status : 'missing');
check('Ezra 5:11 "الَّذِي" NOT VERIFIED_CLEAN while carrying alerts', Boolean(ezraAlladhi) && ezraAlladhi.status !== 'VERIFIED_CLEAN', ezraAlladhi ? ezraAlladhi.status : 'missing');

// Gate E: Every VERIFIED_CLEAN has 0 alerts in strict audit
let badClean = [];
for (const v of prop.verses) {
  for (const u of v.units) {
    if (u.status === 'VERIFIED_CLEAN' && alertKeys.has(`${v.verse}#${u.arPos}`)) {
      badClean.push(`${v.verse}#${u.arPos}`);
    }
  }
}
check('Every VERIFIED_CLEAN unit has 0 alerts in strict audit', badClean.length === 0, badClean.join(', '));

console.log(`\nSUMMARY: ${passed}/${total} alignment engine regression gates passed.`);
if (passed !== total) process.exit(1);
