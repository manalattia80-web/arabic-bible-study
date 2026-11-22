/**
 * scripts/protected_adjudicated_registry.cjs
 *
 * Builds the canonical Protected Adjudicated Registry from already-calibrated verse sets:
 *   - B20 (20 verses, 311 units)
 *   - R1  (15 verses, 253 units)
 *   - R2  (15 verses, 255 units)
 *   - R3  (15 verses, 234 units)
 *   - Verses guarded by automated_database_audit.cjs (e.g. Gen 3:6, Isa 53:5, John 3:16, etc.)
 *
 * Strictly excludes Round 4B (and any future unseen evaluation sample).
 * Provides cryptographic SHA-256 fingerprinting of all protected rows + word_mapping_strongs
 * to prove 100% immutability of adjudicated records across automated engine runs.
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

const sha256Str = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

function loadProtectedAdjudicatedVerses() {
  const keys = new Set();

  const b20 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/batch_20_verses_manifest.json'), 'utf8')).verses || [];
  const r1 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'), 'utf8')).holdout_verses || [];
  const r2 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'), 'utf8')).holdout_verses || [];
  const r3 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json'), 'utf8')).holdout_verses || [];

  for (const v of [...b20, ...r1, ...r2, ...r3]) {
    keys.add(`${v.book}:${v.ch}:${v.vs}`);
  }

  // Extract all verses explicitly guarded by automated_database_audit.cjs
  const auditSrc = fs.readFileSync(path.join(repoRoot, 'scripts/automated_database_audit.cjs'), 'utf8');
  const re1 = /book_id\s*=\s*(\d+)\s+AND\s+(?:v\.|vr\.)?chapter_num\s*=\s*(\d+)\s+AND\s+(?:v\.|vr\.)?verse_num\s*=\s*(\d+)/gi;
  let m;
  while ((m = re1.exec(auditSrc)) !== null) {
    keys.add(`${m[1]}:${m[2]}:${m[3]}`);
  }
  // Explicitly include verses checked via book/chapter variables in automated_database_audit.cjs
  for (const k of ['1:3:6', '1:22:16', '6:1:9', '23:40:8', '43:6:44', '43:13:8', '51:1:23']) {
    keys.add(k);
  }

  return keys;
}

function computeProtectedRegistryFingerprint(dbPath, protectedVerseKeys) {
  const sortedKeys = Array.from(protectedVerseKeys).sort();
  const whereClauses = sortedKeys.map(k => {
    const [b, c, v] = k.split(':');
    return `(vr.book_id=${b} AND vr.chapter_num=${c} AND vr.verse_num=${v})`;
  }).join(' OR ');

  const wmDump = execFileSync(sqlitePath, [dbPath], {
    input: `
      SELECT vr.book_id, vr.chapter_num, vr.verse_num, wm.ar_word_position, wm.ar_word,
             COALESCE(wm.strongs_id,''), COALESCE(wm.orig_word,''), COALESCE(wm.orig_surface,''),
             COALESCE(wm.orig_word_position,''), COALESCE(wm.orig_morphology,''),
             COALESCE(wm.morph_pos,''), COALESCE(wm.morph_stem,''), COALESCE(wm.morph_tense,''),
             COALESCE(wm.morph_voice,''), COALESCE(wm.morph_mood,''), COALESCE(wm.morph_person,''),
             COALESCE(wm.morph_number,''), COALESCE(wm.morph_gender,''), COALESCE(wm.morph_case,''),
             COALESCE(wm.verified_locator,''), COALESCE(wm.verified_source,''), COALESCE(wm.morph_source,''),
             COALESCE(wm.relation_type,''), COALESCE(wm.grammar_notes,'')
      FROM word_mappings wm
      JOIN verses vr ON wm.verse_id = vr.id
      WHERE ${whereClauses}
      ORDER BY vr.book_id, vr.chapter_num, vr.verse_num, wm.ar_word_position;
    `,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  }).replace(/\r/g, '').trim();

  const wmsDump = execFileSync(sqlitePath, [dbPath], {
    input: `
      SELECT vr.book_id, vr.chapter_num, vr.verse_num, wm.ar_word_position,
             wms.link_order, COALESCE(wms.link_role,''), COALESCE(wms.strongs_id,''),
             COALESCE(wms.orig_component,''), COALESCE(wms.orig_word_position,''),
             COALESCE(wms.orig_morphology,''), COALESCE(wms.morph_source,'')
      FROM word_mapping_strongs wms
      JOIN word_mappings wm ON wms.mapping_id = wm.id
      JOIN verses vr ON wm.verse_id = vr.id
      WHERE ${whereClauses}
      ORDER BY vr.book_id, vr.chapter_num, vr.verse_num, wm.ar_word_position, wms.link_order;
    `,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  }).replace(/\r/g, '').trim();

  return {
    protectedVerseCount: sortedKeys.length,
    protectedRowCount: wmDump ? wmDump.split('\n').length : 0,
    protectedComponentCount: wmsDump ? wmsDump.split('\n').length : 0,
    wordMappingsSha256: sha256Str(wmDump + '\n'),
    wordMappingStrongsSha256: sha256Str(wmsDump + '\n')
  };
}

module.exports = { loadProtectedAdjudicatedVerses, computeProtectedRegistryFingerprint };
