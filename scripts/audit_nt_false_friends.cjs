const fs = require('fs');
const path = require('path');
const readline = require('readline');

const gntPath = path.resolve(__dirname, 'data/gnt_scrivener.json');
const csvPath = path.resolve(__dirname, 'nt_mappings.csv');

console.log('Loading gnt_scrivener.json...');
const gntData = JSON.parse(fs.readFileSync(gntPath, 'utf8'));

const bookMap = {
  'Matt': 40, 'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44,
  'Rom': 45, '1Cor': 46, '2Cor': 47, 'Gal': 48, 'Eph': 49,
  'Phil': 50, 'Col': 51, '1Thess': 52, '2Thess': 53, '1Tim': 54,
  '2Tim': 55, 'Titus': 56, 'Phlm': 57, 'Heb': 58, 'Jas': 59,
  '1Pet': 60, '2Pet': 61, '1John': 62, '2John': 63, '3John': 64,
  'Jude': 65, 'Rev': 66
};

const verseStrongs = new Map();

for (const v of gntData) {
  const bId = bookMap[v.book_name_osis];
  if (!bId) continue;
  const key = `${bId}:${v.chapter}:${v.verse}`;
  const strongSet = new Set();
  if (Array.isArray(v.words)) {
    for (const w of v.words) {
      if (w.strong) {
        strongSet.add(parseInt(w.strong, 10));
      }
    }
  }
  verseStrongs.set(key, strongSet);
}

console.log(`Indexed ${verseStrongs.size} NT verses from GNT Scrivener.`);

async function processCSV() {
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  let totalRows = 0;
  const falseFriends = [];

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    if (!line.trim()) continue;
    totalRows++;

    // Parse CSV line (simple split, handling quotes)
    const parts = line.split(',');
    if (parts.length < 9) continue;

    const id = parts[0];
    const book_id = parseInt(parts[1], 10);
    const book_name = parts[2];
    const chapter_num = parseInt(parts[3], 10);
    const verse_num = parseInt(parts[4], 10);
    const pos = parseInt(parts[5], 10);
    const ar_word = parts[6];
    const orig_word = parts[7];
    const strongs_id = parts[8].trim();

    if (!strongs_id.startsWith('G')) continue;
    const sNum = parseInt(strongs_id.replace('G', ''), 10);
    if (isNaN(sNum)) continue;

    const key = `${book_id}:${chapter_num}:${verse_num}`;
    const validSet = verseStrongs.get(key);

    if (!validSet) continue;

    if (!validSet.has(sNum)) {
      falseFriends.push({
        id,
        book_id,
        book: book_name,
        chapter: chapter_num,
        verse: verse_num,
        pos,
        word: ar_word,
        assigned_strong: strongs_id,
        assigned_orig: orig_word
      });
    }
  }

  console.log(`\n========================================`);
  console.log(`Audited ${totalRows} NT word_mappings records.`);
  console.log(`Total False Friends Found in NT: ${falseFriends.length}`);
  console.log(`Percentage of Mismatched Links: ${((falseFriends.length / totalRows) * 100).toFixed(2)}%`);
  console.log(`========================================\n`);

  // Group by book
  const byBook = {};
  for (const ff of falseFriends) {
    byBook[ff.book] = (byBook[ff.book] || 0) + 1;
  }
  console.log('False Friends per book:');
  for (const [b, count] of Object.entries(byBook)) {
    console.log(`  - ${b}: ${count}`);
  }

  // Write top samples to json
  fs.writeFileSync('scripts/nt_false_friends.json', JSON.stringify(falseFriends, null, 2), 'utf8');

  console.log('\nTop 20 Critical Samples:');
  falseFriends.slice(0, 20).forEach(f => {
    console.log(`- [${f.book} ${f.chapter}:${f.verse}] كلمة «${f.word}» أُسندت لـ ${f.assigned_strong} (${f.assigned_orig}) [غير موجودة إطلاقاً في متن الآية اليوناني!]`);
  });
}

processCSV();
