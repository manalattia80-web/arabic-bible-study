const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_q_optb.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { encoding: 'utf8' }).trim();
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// OSHB Parser
const oshbDir = path.resolve(__dirname, 'data/oshb');
function getOshbWords(book, osisRef) {
  const content = fs.readFileSync(path.join(oshbDir, `${book}.xml`), 'utf8');
  const verseRegex = new RegExp(`<verse\\s+osisID="${osisRef}"[^>]*>([\\s\\S]*?)</verse>`);
  const match = content.match(verseRegex);
  if (!match) return null;
  const verseXml = match[1];
  const words = [];
  const wordRegex = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
  let wMatch;
  let idx = 1;
  while ((wMatch = wordRegex.exec(verseXml)) !== null) {
    const attrs = wMatch[1];
    const text = wMatch[2].replace(/<[^>]+>/g, '').trim();
    const lemmaMatch = attrs.match(/lemma="([^"]+)"/);
    const morphMatch = attrs.match(/morph="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/);
    words.push({
      index: idx++,
      id: idMatch ? idMatch[1] : null,
      lemma: lemmaMatch ? lemmaMatch[1] : null,
      morph: morphMatch ? morphMatch[1] : null,
      text: text
    });
  }
  return words;
}

// SBLGNT Parser
const sblgntDir = path.resolve(__dirname, 'data/sblgnt');
const sblgntBookMap = { 50: '71-Php-morphgnt.txt' };
function getSblgntTokens(bookId, ch, vs) {
  const fileName = sblgntBookMap[bookId];
  if (!fileName) return null;
  const filePath = path.join(sblgntDir, fileName);
  const prefix = String(bookId - 39).padStart(2, '0') +
                 String(ch).padStart(2, '0') +
                 String(vs).padStart(2, '0');
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');
  const tokens = [];
  let idx = 1;
  for (const line of lines) {
    if (!line.startsWith(prefix)) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 7) {
      tokens.push({
        index: idx++,
        pos: parts[1],
        parseCode: parts[2],
        morph: `${parts[1]} ${parts[2]}`,
        surfacePunct: parts[3],
        surfaceClean: parts[4],
        surfaceNorm: parts[5],
        lemma: parts[6]
      });
    }
  }
  return tokens;
}

console.log('========================================================================');
console.log(' OPTION (B) SIMULATION: CANDIDATE REALIGNMENT (READ-ONLY / NO DB WRITE) ');
console.log('========================================================================\n');

// 1. Deuteronomy 6:5 Analysis
console.log('▶ [PRIORITY 2] DEUTERONOMY 6:5 (التثنية ٦:٥) CONTEXTUAL REALIGNMENT CANDIDATES:');
const deutWords = getOshbWords('Deut', 'Deut.6.5');
console.log('OSHB Tokens (Total ' + deutWords.length + '):');
deutWords.forEach(w => console.log(`   w${w.index}: ${w.text} | lemma: ${w.lemma} | morph: ${w.morph} | id: ${w.id}`));

const deutDb = query(`
  SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word_position, wm.verified_locator
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 5 AND v.chapter_num = 6 AND v.verse_num = 5 ORDER BY wm.ar_word_position;
`).split('\n');

console.log('\nDB Alignment Analysis:');
deutDb.forEach(l => {
  const [pos, word, strongs, origPos, loc] = l.split('|');
  console.log(`   ar_w${pos}: "${word}" (Strongs: ${strongs || 'NONE'}, current origPos: ${origPos}, loc: ${loc})`);
});

// Specifically analyze "كُلِّ" repetition in Deut 6:5:
console.log('\n   [CRITICAL OBSERVATION - MULTIPLE OCCURRENCES OF "كُلِّ" (H3605)]');
const kolTokens = deutWords.filter(w => w.lemma && w.lemma.includes('3605'));
kolTokens.forEach(k => {
  console.log(`   Candidate Hebrew Token w${k.index}: "${k.text}" (morph: ${k.morph}, id: ${k.id})`);
  const nextToken = deutWords.find(w => w.index === k.index + 1);
  console.log(`      -> Followed by w${k.index + 1}: "${nextToken ? nextToken.text : 'END'}" (morph: ${nextToken ? nextToken.morph : ''})`);
});

// 2. Exodus 15:2 Analysis
console.log('\n▶ [PRIORITY 2] EXODUS 15:2 (الخروج ١٥:٢) CONTEXTUAL REALIGNMENT CANDIDATES:');
const exoWords = getOshbWords('Exod', 'Exod.15.2');
console.log('OSHB Tokens (Total ' + exoWords.length + '):');
exoWords.forEach(w => console.log(`   w${w.index}: ${w.text} | lemma: ${w.lemma} | morph: ${w.morph} | id: ${w.id}`));

const exoDb = query(`
  SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word_position, wm.verified_locator
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 2 AND v.chapter_num = 15 AND v.verse_num = 2 ORDER BY wm.ar_word_position;
`).split('\n');

console.log('\nDB Alignment Analysis:');
exoDb.forEach(l => {
  const [pos, word, strongs, origPos, loc] = l.split('|');
  console.log(`   ar_w${pos}: "${word}" (Strongs: ${strongs || 'NONE'}, current origPos: ${origPos}, loc: ${loc})`);
});

// 3. Philippians 4:6 Analysis
console.log('\n▶ [PRIORITY 2] PHILIPPIANS 4:6 (فيلبي ٤:٦) CONTEXTUAL REALIGNMENT CANDIDATES:');
const philTokens = getSblgntTokens(50, 4, 6);
console.log('SBLGNT Tokens (Total ' + philTokens.length + '):');
philTokens.forEach(t => console.log(`   w${t.index}: ${t.surfaceClean} | lemma: ${t.lemma} | morph: ${t.morph}`));

const philDb = query(`
  SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word_position, wm.verified_locator
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 50 AND v.chapter_num = 4 AND v.verse_num = 6 ORDER BY wm.ar_word_position;
`).split('\n');

console.log('\nDB Alignment Analysis:');
philDb.forEach(l => {
  const [pos, word, strongs, origPos, loc] = l.split('|');
  console.log(`   ar_w${pos}: "${word}" (Strongs: ${strongs || 'NONE'}, current origPos: ${origPos}, loc: ${loc})`);
});
