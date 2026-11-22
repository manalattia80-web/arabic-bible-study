/**
 * scripts/audit_engine_v1_2_stratified_sample.cjs
 *
 * Deterministically draws a stratified sample of 36 modified records from the v1.2 full-66-book
 * isolated diff log (scratch/full_66books_engine_v1_2_diff.jsonl) across ALL 3 languages
 * (Hebrew, Aramaic, Greek) and ALL 4 active repair rules (G1, G1B, G2, G3), and cross-checks
 * every sampled record against OSHB/SBLGNT + strongs_entries for human source review.
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
const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');
const diffPath = path.join(repoRoot, 'scratch/full_66books_engine_v1_2_diff.jsonl');

const sha256Str = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

const SEED = 'v1.2-stratified-source-audit:e50ebe605f9d84f8d68cbd12cdb1d9ab9be419cb';

// Load strongs_entries glosses for human source review
const glossMap = new Map();
{
  const raw = execFileSync(sqlitePath, [prodDb], {
    input: "SELECT strongs_id, COALESCE(original_word,''), COALESCE(replace(replace(definition_en, char(10), ' '), char(9), ' '),'') FROM strongs_entries;",
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  }).replace(/\r/g, '').trim();
  for (const l of raw.split('\n')) {
    if (!l) continue;
    const p1 = l.indexOf('|');
    const p2 = l.indexOf('|', p1 + 1);
    if (p1 < 0 || p2 < 0) continue;
    glossMap.set(l.slice(0, p1), { orig: l.slice(p1 + 1, p2), def: l.slice(p2 + 1).slice(0, 80) });
  }
}

// Target strata: (lang, rule) -> sample count
const STRATA = [
  { lang: 'hebrew',  rule: 'RULE_G1_UNIQUE_BIJECTIVE_RELOC',       n: 4 },
  { lang: 'hebrew',  rule: 'RULE_G1B_UNIQUE_OSHB_ROOT_RELOC',      n: 4 },
  { lang: 'hebrew',  rule: 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK',n: 4 },
  { lang: 'hebrew',  rule: 'RULE_G3_UNIQUE_LOCKED_DERIVED_MORPH',  n: 3 },
  { lang: 'aramaic', rule: 'RULE_G1_UNIQUE_BIJECTIVE_RELOC',       n: 3 },
  { lang: 'aramaic', rule: 'RULE_G1B_UNIQUE_OSHB_ROOT_RELOC',      n: 2 },
  { lang: 'aramaic', rule: 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK',n: 2 },
  { lang: 'aramaic', rule: 'RULE_G3_UNIQUE_LOCKED_DERIVED_MORPH',  n: 2 },
  { lang: 'greek',   rule: 'RULE_G1_UNIQUE_BIJECTIVE_RELOC',       n: 5 },
  { lang: 'greek',   rule: 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK',n: 4 },
  { lang: 'greek',   rule: 'RULE_G3_UNIQUE_LOCKED_DERIVED_MORPH',  n: 3 }
];

const buckets = new Map();
for (const s of STRATA) buckets.set(`${s.lang}|${s.rule}`, []);

const lines = fs.readFileSync(diffPath, 'utf8').trim().split('\n');
for (const l of lines) {
  if (!l) continue;
  const d = JSON.parse(l);
  const k = `${d.lang}|${d.ruleId}`;
  const b = buckets.get(k);
  if (b) {
    const h = sha256Str(`${SEED}:${d.mappingId}:${d.verse}:${d.arPos}`);
    b.push({ h, d });
  }
}

const sampled = [];
for (const s of STRATA) {
  const k = `${s.lang}|${s.rule}`;
  const arr = buckets.get(k) || [];
  arr.sort((a, b) => a.h.localeCompare(b.h));
  const picked = arr.slice(0, s.n);
  for (const item of picked) {
    const d = item.d;
    const beforeGloss = glossMap.get(d.before.strongsId) || { orig: '', def: '' };
    const afterGloss = glossMap.get(d.after.strongsId) || { orig: '', def: '' };
    sampled.push({
      lang: d.lang,
      rule: d.ruleId,
      verse: d.verse,
      arPos: d.arPos,
      arWord: d.arWord,
      before: {
        sid: d.before.strongsId,
        orig: d.before.origWord,
        surf: d.before.origSurface,
        pos: d.before.origPos,
        morph: d.before.origMorph,
        mpos: d.before.morphPos,
        gloss: beforeGloss.def
      },
      after: {
        sid: d.after.strongsId,
        orig: d.after.origWord,
        surf: d.after.origSurface,
        pos: d.after.origPos,
        morph: d.after.origMorph,
        mpos: d.after.morphPos,
        loc: d.after.verifiedLocator,
        gloss: afterGloss.def
      },
      stratumPoolSize: arr.length
    });
  }
}

const outJson = path.join(repoRoot, 'scratch/v1_2_stratified_sample_36.json');
fs.writeFileSync(outJson, JSON.stringify({ seed: SEED, totalSampled: sampled.length, records: sampled }, null, 2) + '\n', 'utf8');

console.log(`Sampled ${sampled.length} records across ${STRATA.length} (lang, rule) strata:`);
for (const r of sampled) {
  console.log(`[${r.lang.padEnd(7)}|${r.rule.replace('RULE_', '').slice(0, 14).padEnd(14)}] ${r.verse.padEnd(13)} #${String(r.arPos).padStart(2)} ${r.arWord} | ${r.before.sid}@w${r.before.pos}(${r.before.orig}) -> ${r.after.sid}@w${r.after.pos}(${r.after.orig} | ${r.after.surf} | ${r.after.morph}) [${r.after.gloss.slice(0, 40)}]`);
}
