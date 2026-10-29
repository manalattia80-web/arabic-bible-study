const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function querySql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_eval_query.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    const res = execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { encoding: 'utf8', windowsHide: true });
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    return res.trim();
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw e;
  }
}

// Seeded pseudorandom number generator (Mulberry32) for reproducible uniform random selection
function createMulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

console.log('=== Building Independent 60-Verse Sample & Anomaly Inspection Criteria ===');

// 1. Gather all excluded verses (verses that were previously audited, benchmarked, or corrected)
const excludedVersesSql = `
  SELECT DISTINCT v.book_id, v.chapter_num, v.verse_num
  FROM verses v
  WHERE v.id IN (
    SELECT DISTINCT verse_id FROM word_mappings 
    WHERE is_verified=1 
       OR verified_source IS NOT NULL
       OR morph_source IN ('expert_philological_audit', 'manual_review')
  )
  OR (v.book_id = 5 AND v.chapter_num = 23 AND v.verse_num = 2) -- Deut 23:2 (video 1)
  OR (v.book_id = 27 AND v.chapter_num = 3 AND v.verse_num = 30) -- Dan 3:30
  OR (v.book_id = 30 AND v.chapter_num = 1 AND v.verse_num = 4)  -- Amos 1:4
  ORDER BY v.book_id, v.chapter_num, v.verse_num;
`;

const excludedRows = querySql(excludedVersesSql).split('\n').filter(Boolean);
const excludedSet = new Set(excludedRows.map(r => {
  const [b, c, v] = r.split('|').map(Number);
  return `${b}:${c}:${v}`;
}));

console.log(`Excluded previously audited/corrected verses: ${excludedSet.size}`);

// 2. Fetch all Hebrew verses (OT books 1 to 39, excluding Aramaic passages)
const allHebrewVersesSql = `
  SELECT DISTINCT v.book_id, b.name_ar, b.name_en, v.chapter_num, v.verse_num
  FROM verses v
  JOIN books b ON v.book_id = b.id
  JOIN word_mappings wm ON wm.verse_id = v.id
  WHERE v.book_id BETWEEN 1 AND 39
    AND wm.orig_word_lang = 'hebrew'
    AND v.id NOT IN (SELECT DISTINCT verse_id FROM word_mappings WHERE orig_word_lang = 'aramaic')
  ORDER BY v.book_id, v.chapter_num, v.verse_num;
`;

const hebrewRows = querySql(allHebrewVersesSql).split('\n').filter(Boolean).map(line => {
  const [book_id, name_ar, name_en, chapter, verse] = line.split('|');
  return { book_id: Number(book_id), name_ar, name_en, chapter: Number(chapter), verse: Number(verse) };
}).filter(v => !excludedSet.has(`${v.book_id}:${v.chapter}:${v.verse}`));

console.log(`Eligible fresh Hebrew verses: ${hebrewRows.length}`);

// 3. Fetch all Greek verses (NT books 40 to 66)
const allGreekVersesSql = `
  SELECT DISTINCT v.book_id, b.name_ar, b.name_en, v.chapter_num, v.verse_num
  FROM verses v
  JOIN books b ON v.book_id = b.id
  WHERE v.book_id BETWEEN 40 AND 66
  ORDER BY v.book_id, v.chapter_num, v.verse_num;
`;

const greekRows = querySql(allGreekVersesSql).split('\n').filter(Boolean).map(line => {
  const [book_id, name_ar, name_en, chapter, verse] = line.split('|');
  return { book_id: Number(book_id), name_ar, name_en, chapter: Number(chapter), verse: Number(verse) };
}).filter(v => !excludedSet.has(`${v.book_id}:${v.chapter}:${v.verse}`));

console.log(`Eligible fresh Greek verses: ${greekRows.length}`);

// 4. Fetch all Aramaic verses (portions in Daniel 2-7, Ezra 4-7, Jer 10:11, Gen 31:47)
const allAramaicVersesSql = `
  SELECT DISTINCT v.book_id, b.name_ar, b.name_en, v.chapter_num, v.verse_num
  FROM verses v
  JOIN books b ON v.book_id = b.id
  JOIN word_mappings wm ON wm.verse_id = v.id
  WHERE wm.orig_word_lang = 'aramaic'
  ORDER BY v.book_id, v.chapter_num, v.verse_num;
`;

const aramaicRows = querySql(allAramaicVersesSql).split('\n').filter(Boolean).map(line => {
  const [book_id, name_ar, name_en, chapter, verse] = line.split('|');
  return { book_id: Number(book_id), name_ar, name_en, chapter: Number(chapter), verse: Number(verse) };
}).filter(v => !excludedSet.has(`${v.book_id}:${v.chapter}:${v.verse}`));

console.log(`Eligible fresh Aramaic verses: ${aramaicRows.length}`);

// 5. Sample reproducibly: 30 Hebrew, 24 Greek, 6 Aramaic (Seed: 20261029)
const rng = createMulberry32(20261029);

const sampleHebrew = shuffleArray(hebrewRows, rng).slice(0, 30);
const sampleGreek = shuffleArray(greekRows, rng).slice(0, 24);
const sampleAramaic = shuffleArray(aramaicRows, rng).slice(0, 6);

// Sort each sample canonical by book, chapter, verse
const canonicalSort = (a, b) => a.book_id - b.book_id || a.chapter - b.chapter || a.verse - b.verse;
sampleHebrew.sort(canonicalSort);
sampleGreek.sort(canonicalSort);
sampleAramaic.sort(canonicalSort);

const heldOutSample = {
  metadata: {
    generated_at: new Date().toISOString(),
    random_seed: 20261029,
    algorithm: 'mulberry32_uniform_shuffle',
    total_verses: 60,
    languages: {
      hebrew: 30,
      greek: 24,
      aramaic: 6
    },
    exclusion_criteria: 'All previously verified, corrected, or benchmarked loci (including audit suite and video verses)'
  },
  hebrew: sampleHebrew,
  greek: sampleGreek,
  aramaic: sampleAramaic
};

fs.writeFileSync(path.resolve(__dirname, 'held_out_60_verses_sample.json'), JSON.stringify(heldOutSample, null, 2), 'utf8');
console.log('Successfully saved held_out_60_verses_sample.json!');

// Output preview
console.log('\n--- 30 Hebrew Verses ---');
sampleHebrew.forEach((v, i) => console.log(`${String(i+1).padStart(2, ' ')}. ${v.name_ar} (${v.name_en}) ${v.chapter}:${v.verse}`));

console.log('\n--- 24 Greek Verses ---');
sampleGreek.forEach((v, i) => console.log(`${String(i+1).padStart(2, ' ')}. ${v.name_ar} (${v.name_en}) ${v.chapter}:${v.verse}`));

console.log('\n--- 6 Aramaic Verses ---');
sampleAramaic.forEach((v, i) => console.log(`${String(i+1).padStart(2, ' ')}. ${v.name_ar} (${v.name_en}) ${v.chapter}:${v.verse}`));
