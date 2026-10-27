const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const SAMPLE_PATH = path.resolve(__dirname, '../alignment_audit_v299/measurement_sample_1000_tokens.json');

const sample = JSON.parse(fs.readFileSync(SAMPLE_PATH, 'utf8'));

// Build temporary SQL table or single WHERE IN query
const idList = sample.map(s => `'${s.id}'`).join(',');
const sql = `SELECT id, strongs_id, orig_word, orig_surface, morph_pos FROM word_mappings WHERE id IN (${idList});`;

const tmpFile = path.resolve(__dirname, 'temp_batch_eval.sql');
fs.writeFileSync(tmpFile, sql, 'utf8');

const raw = execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
try { fs.unlinkSync(tmpFile); } catch (_) {}

const dbMap = new Map();
raw.replace(/\r/g, '').split('\n').forEach(line => {
  const parts = line.split('|');
  dbMap.set(parts[0], {
    strongs_id: parts[1] || null,
    orig_word: parts[2] || null,
    orig_surface: parts[3] || null,
    morph_pos: parts[4] || null
  });
});

console.log('========================================================================');
console.log('       INDEPENDENT 1,000-TOKEN MEASUREMENT SAMPLE EVALUATION            ');
console.log('========================================================================\n');

let strongsMatches = 0;
let posMatches = 0;
let origWordMatches = 0;
let surfaceMatches = 0;

const errors = {
  strongs: [],
  pos: [],
  orig_word: [],
  orig_surface: []
};

function norm(str) {
  if (!str) return '';
  return str.trim()
    .replace(/[\u0591-\u05C7]/g, '') // Hebrew cantillation and niqqud
    .replace(/[\u0300-\u036f]/g, '') // Greek accents
    .replace(/[«».,:;]/g, '');
}

function cleanVal(v) {
  if (!v) return null;
  const s = v.trim();
  if (s === '' || s === '-' || s === '---' || s === '—') return null;
  return s;
}

for (const token of sample) {
  const actual = dbMap.get(token.id);
  if (!actual) {
    errors.strongs.push({ token, actual: 'NOT_FOUND', reason: 'Record not in DB' });
    continue;
  }

  const actStrongs = cleanVal(actual.strongs_id);
  const expStrongs = cleanVal(token.strongs_id);

  // 1. Strong's check
  if (actStrongs === expStrongs) {
    strongsMatches++;
  } else {
    errors.strongs.push({
      locus: `${token.book_name} ${token.chapter_num}:${token.verse_num} (#${token.ar_word_position} "${token.ar_word}")`,
      expected: expStrongs,
      actual: actStrongs
    });
  }

  const actPos = cleanVal(actual.morph_pos);
  const expPos = cleanVal(token.morph_pos);

  // 2. POS check
  if (actPos === expPos) {
    posMatches++;
  } else {
    errors.pos.push({
      locus: `${token.book_name} ${token.chapter_num}:${token.verse_num} (#${token.ar_word_position} "${token.ar_word}")`,
      expected: expPos,
      actual: actPos
    });
  }

  const actWord = norm(actual.orig_word);
  const expWord = norm(token.orig_word);

  // 3. Orig Word check (normalized)
  if (actWord === expWord) {
    origWordMatches++;
  } else {
    errors.orig_word.push({
      locus: `${token.book_name} ${token.chapter_num}:${token.verse_num} (#${token.ar_word_position} "${token.ar_word}")`,
      expected: expWord,
      actual: actWord
    });
  }

  const actSurface = norm(actual.orig_surface);
  const expSurface = norm(token.orig_surface);

  // 4. Orig Surface check (normalized)
  if (actSurface === expSurface) {
    surfaceMatches++;
  } else {
    errors.orig_surface.push({
      locus: `${token.book_name} ${token.chapter_num}:${token.verse_num} (#${token.ar_word_position} "${token.ar_word}")`,
      expected: expSurface,
      actual: actSurface
    });
  }
}

const total = sample.length;
console.log(`Evaluated Sample Size: ${total} stratified biblical tokens\n`);
console.log(`1. Strong's Concordance Accuracy: ${strongsMatches}/${total} (${((strongsMatches/total)*100).toFixed(2)}%)`);
console.log(`2. Part-of-Speech (POS) Accuracy: ${posMatches}/${total} (${((posMatches/total)*100).toFixed(2)}%)`);
console.log(`3. Original Lemma (orig_word) Accuracy: ${origWordMatches}/${total} (${((origWordMatches/total)*100).toFixed(2)}%)`);
console.log(`4. Textual Surface Form (orig_surface) Accuracy: ${surfaceMatches}/${total} (${((surfaceMatches/total)*100).toFixed(2)}%)\n`);

console.log('Sample of Strong\'s Discrepancies (first 10):');
console.log(JSON.stringify(errors.strongs.slice(0, 10), null, 2));

console.log('\nSample of POS Discrepancies (first 10):');
console.log(JSON.stringify(errors.pos.slice(0, 10), null, 2));

console.log('\nSample of Surface Discrepancies (first 10):');
console.log(JSON.stringify(errors.orig_surface.slice(0, 10), null, 2));
